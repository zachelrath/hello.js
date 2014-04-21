//
// Grunttask runners
//
module.exports = function(grunt) {

	function merge(a,b){
		for(var x in b){
			a[x] = b[x];
		}
		return a;
	}

	function concat(name){
		return {
			src: ['dist/'+name+'.js', 'src/hello.amd.js'],//, 'test/**/*.js'],
			dest : 'dist/'+name+'.js'
		};
	}

	function require_options(name, opts){
		return {
			options: merge({
				baseUrl : 'src',
				name : name,
				out : 'dist/'+name+ (opts&&opts.optimize?'.min':'')+'.js',
				optimize : 'none',

				// FORMATTING
				'wrap': {
					'start': '(function(window,document,undefined){',
					'end': '})(window,document)',
				},
				onModuleBundleComplete: function (data) {
					var fs = require('fs'),
						amdclean = require('amdclean'),
						outputFile = data.path;

					fs.writeFileSync(outputFile, amdclean.clean({
						'filePath': outputFile
					}));
				}
			}, opts)
		};
	}

	// //////////////////////////
	// 
	// //////////////////////////

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		requirejs : {
			develop : require_options('hello'),
			minified : require_options('hello',{
				optimize: "uglify2"
			}),
			all_develop : require_options('hello.all'),
			all_minified : require_options('hello.all',{
				optimize: "uglify2"
			})
		},
		concat: {
			options: {
				//stripBanners: true,
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %> */\n',
			},
			develop : concat('hello'),
			minified : concat('hello.min'),
			all_develop : concat('hello.all'),
			all_minified : concat('hello.all.min')
		},
		jshint: {
			files: ['Gruntfile.js', 'src/**/*.js'],//, 'test/**/*.js'],
			options: {
				// options here to override JSHint defaults
				globals: {
					console: true,
					module: true,
					document: true
				},
				// dont check dot notation
				sub :true
			}
		},
		watch: {
			files: ['<%= jshint.files %>'],
			tasks: ['jshint']
		},

		// Shunt files around
		shunt : {
			// Shunt the documents of our project
			docs : {
				'README.md' : './index.html'
			},
			// Combine the src files, create minified versions
			build : {
				'dist/hello.js' : ['src/hello.js', 'src/hello.amd.js'],
				'dist/hello.all.js' : ['src/hello.js', 'src/modules/', 'src/hello.amd.js']
			},
			minify : {
				'dist/hello.min.js' : 'dist/hello.js',
				'dist/hello.all.min.js' : 'dist/hello.all.js'
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('shunt');

	grunt.registerTask('test', ['jshint']);
	grunt.registerTask('default', ['jshint', 'requirejs', 'concat']);

};